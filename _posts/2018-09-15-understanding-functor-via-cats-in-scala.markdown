---
layout: post
title: "Understanding functor via cats in scala"
date: 2018-09-15 22:05:47 0530
categories: functional programming scala
author: ScalaMill LLP
tags: scala, cats, functor
---

In previous posts we learned something about Semigroup and Monoid in Cats. Now we will look into a Fucntor.

<strong>What is a Functor.</strong>

According to Wikipedia: In <a title="Mathematics" href="https://en.wikipedia.org/wiki/Mathematics">mathematics</a>, a <b>functor</b> is a map between <a title="Category (mathematics)" href="https://en.wikipedia.org/wiki/Category_(mathematics)">categories</a>. Functors were first considered in <a title="Algebraic topology" href="https://en.wikipedia.org/wiki/Algebraic_topology">algebraic topology</a>, where algebraic objects (such as the <a title="Fundamental group" href="https://en.wikipedia.org/wiki/Fundamental_group">fundamental group</a>) are associated to <a title="Topological space" href="https://en.wikipedia.org/wiki/Topological_space">topological spaces</a>, and maps between these algebraic objects are associated to <a title="Continuous function" href="https://en.wikipedia.org/wiki/Continuous_function">continuous</a> maps between spaces. Nowadays, functors are used throughout modern mathematics to relate various categories. Thus, functors are important in all areas within mathematics to which <a title="Category theory" href="https://en.wikipedia.org/wiki/Category_theory">category theory</a> is applied.

Looks strange and hard to Understand but yes Functor maps between these algebraic objects. Functor basically unwraps a object out of a context and let's you map the object via a function to the other object in the same context.

{% highlight scala %}
trait Functor[F[_]] {
  def map[A, B](fa: F[A])(f: A => B): F[B]
}
{% endhighlight %}


In the above definition <strong>F</strong> is type of the context, container or type of the Kind. It could be list, option or your custom kind types. <strong>fa</strong> is a value of kind type which contains the values of datatype <strong>A</strong>. <strong>f</strong> is a function which will transform each value inside a context into a type <strong>B</strong>. <strong>F[B]</strong> will be the context/collection of datatype <strong>B</strong>.

In order to use them with cats we need to import below statements. 

{% highlight scala %}
import cats.Functor
import cats.instances.list._
import cats.instances.option._
{% endhighlight %}

Cats have functors available for some datatype list, option and their are ways to compose functor together as you see in below examples. As per the Functor
definition it is unwrapping the element from the context(option, list, listOption) 

{% highlight scala %}
val option = Some(1)
val list = List(1,2,3)
val listOption = List(Option(1), Option(2), Option(3))
println(Functor[Option].map(option)(x => x+1))
println(Functor[List].map(list)(x => x+1)) 
println(Functor[List].compose[Option].map(listOption)(_ + 1))
{% endhighlight %}

Again we will unsdertand functor in context of banking domain. Bank usually have certain constraints over bank balance, based on that they can take actions on person's account. Like if balance is below a certain amount then they can convert to some other account type or if balance is above a certain amount they can change account type and also can award some more money on top of current balance. First we will create various account type object and bank account case class as below.

{% highlight scala %}
case class BankAccount[T <: AccountType](accountType: T, balance: Int, status: String)

abstract class AccountType
class SavingsAccount extends AccountType
class SalaryAccount extends AccountType
class CurrentAccount extends AccountType
class SomeOtherAccount extends AccountType
{% endhighlight %}

Now our task is to build some mechanism to convert account of one type to some other type. As you can see from above defintion of the functor that a functor takes a collection of datatype **F[A]** which is **BankAccount** in our case. **A** and **B** are Account type and again **F[B]** is a **BankAccount**. Here F is collection type but we see **BankAccount** is not a collection, so what we have **Option** which is not a collection but it has a corresponding functors. Simlarly **Option** is a container for any datatype, we have **BankAccount** as a container for **AccountType**. 

{% highlight scala %}
object BankAccountFunctor {
  def map[A <: AccountType, B <: AccountType](fa: BankAccount[A])(f: A => B): BankAccount[B] = 
  fa.copy(accountType = f(fa.accountType))
}
{% endhighlight %}

Now We will create a list of BankAccounts and see how functor works on them. Below we have some accounts and we are checking each and every account balance and converting them to appropriate type.

{% highlight scala %}
val bankAccount1 = BankAccount(new SalaryAccount, 15000,"Running")
val bankAccount2 = BankAccount(new CurrentAccount, 4000 , "Running")
val bankAccount3 = BankAccount(new SalaryAccount, 60000, "Running")
val list = List(bankAccount1, bankAccount2, bankAccount3)
{% endhighlight %}

1. Convert bankAccount2 to SalaryAccount.
{% highlight scala %}
println(BankAccountFunctor.map(bankAccount1)(x => new SalaryAccount))
{% endhighlight %}


2. Convert All Accounts to CurrentAccount.
{% highlight scala %}
println(list.map(x => BankAccountFunctor.map(x)(x => new CurrentAccount)))
{% endhighlight %}

3. Convert to savings account if balance is below **5000** and make the balance zero and close the account :-(
{% highlight scala %}
println(for {
    bankAccount <- list
    if (bankAccount.balance < 5000)
  } yield BankAccountFunctor.map(bankAccount)(x => new SavingsAccount).copy(balance = 0, status =  "closed"))
{% endhighlight %}

4. Convert to savings account if balance is between **5000**  and **20000** and make the balance reduce by **1000** :-(
{% highlight scala %}
println(for {
    bankAccount <- list2
    if (bankAccount.balance <= 20000 && bankAccount.balance >= 5000)
  } BankAccountFunctor.map(bankAccount)(x => new SavingsAccount).copy(balance = bankAccount.balance - 1000))
{% endhighlight %}

5. Convert to current account if balance is above **50000** and award some **5000** money beacuse person maintain huge money in account :-)
{% highlight scala %}
println(for {
    bankAccount <- list2
    if (bankAccount.balance > 50000)
  } yield BankAccountFunctor.map(bankAccount)(x => new CurrentAccount).copy(balance = bankAccount.balance + 5000))
{% endhighlight %}

Thus we have seen that Functor is a abstraction over kind types to map them between each other, the kind type could be anything, it could be a elementary type or it could be a colection or it could be a container like Option and BankAccount. Hope you will find all this helpful if you are learning scala or any other functional programming language. You can find the code [here](https://github.com/scalamill/cats-in-practice/blob/master/src/main/scala/com/scalamill/meow/Functor.scala). Let us know your opinion in comment box.
